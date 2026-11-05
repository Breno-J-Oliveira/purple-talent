"""Containers de laboratório gerenciados pelo Docker Engine local."""
import os
from pathlib import Path
import docker

BASE = Path(__file__).resolve().parent
OWNER = "cti-purple-lab"
IMAGE_DIRS = {f"cti-lab/web-0{i}": BASE / "challenges" / f"web-0{i}" for i in (1, 2)}

class DockerError(Exception):
    pass

def client():
    try:
        return docker.from_env(timeout=120)
    except docker.errors.DockerException as exc:
        raise DockerError("Docker Engine indisponível. Abra o Docker Desktop em modo Linux.") from exc

def start(name, image, container_port, flag):
    if image not in IMAGE_DIRS:
        raise DockerError("Imagem de laboratório não autorizada.")
    api = client()
    network = None
    container = None
    try:
        try:
            api.images.get(image)
        except docker.errors.ImageNotFound:
            api.images.build(path=str(IMAGE_DIRS[image]), tag=image, rm=True)
        # Uma rede por instância, sem saída para a internet ou para outras redes.
        network = api.networks.create(name, driver="bridge", internal=True,
                                      labels={"cti.owner": OWNER})
        container = api.containers.run(
            image, detach=True, name=name, network=network.name,
            labels={"cti.owner": OWNER}, environment={"FLAG": flag},
            ports={f"{container_port}/tcp": ("127.0.0.1", None)},
            mem_limit="128m", memswap_limit="128m", nano_cpus=500_000_000,
            pids_limit=100, cap_drop=["ALL"], security_opt=["no-new-privileges:true"],
            read_only=True, tmpfs={"/tmp": "rw,noexec,nosuid,size=16m"},
            user="10001:10001", init=True,
            log_config=docker.types.LogConfig(type="json-file", config={"max-size": "1m", "max-file": "1"}))
        container.reload()
        bindings = container.attrs["NetworkSettings"]["Ports"][f"{container_port}/tcp"]
        return int(bindings[0]["HostPort"])
    except (docker.errors.DockerException, KeyError, TypeError, ValueError) as exc:
        if container is not None:
            container.remove(force=True)
        if network is not None:
            network.remove()
        raise DockerError("Não foi possível preparar o container. Confira o Docker e as imagens do laboratório.") from exc
    finally:
        api.close()

def stop(name):
    api = client()
    try:
        try:
            container = api.containers.get(name)
            if container.labels.get("cti.owner") != OWNER:
                raise DockerError("O container não pertence ao laboratório.")
            container.remove(force=True)
        except docker.errors.NotFound:
            pass
        try:
            network = api.networks.get(name)
            if network.attrs.get("Labels", {}).get("cti.owner") == OWNER:
                network.remove()
        except docker.errors.NotFound:
            pass
    except docker.errors.DockerException as exc:
        raise DockerError("Falha ao encerrar o ambiente; tente novamente.") from exc
    finally:
        api.close()

def running_names():
    api = client()
    try:
        # Inclui containers parados para remover os que falharam ou expiraram.
        containers = api.containers.list(all=True, filters={"label": f"cti.owner={OWNER}"})
        running = set()
        for container in containers:
            if container.status == "running":
                running.add(container.name)
            else:
                stop(container.name)
        for network in api.networks.list(filters={"label": f"cti.owner={OWNER}"}):
            if network.name not in running:
                network.remove()
        return running
    except docker.errors.DockerException as exc:
        raise DockerError("Falha ao consultar os ambientes Docker.") from exc
    finally:
        api.close()
