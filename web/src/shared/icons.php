<?php
function icon(string $name, string $class = ''): string {
    $paths = [
      'grid'=>'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      'rank'=>'<path d="M5 21V11h4v10m2 0V3h4v18m2 0v-7h4v7"/>',
      'flag'=>'<path d="M5 21V4m0 0c5-5 9 5 15 0v10c-6 5-10-5-15 0"/>',
      'shield'=>'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
      'briefcase'=>'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0m-9 1v4"/>',
      'arrow'=>'<path d="M5 12h14m-5-5 5 5-5 5"/>',
      'search'=>'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
      'menu'=>'<path d="M4 6h16M4 12h16M4 18h16"/>',
      'user'=>'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
      'terminal'=>'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 9 3 3-3 3m6 0h5"/>',
      'check'=>'<path d="m5 12 4 4L19 6"/>',
      'logout'=>'<path d="M9 3H4v18h5m4-14 5 5-5 5m-5-5h14"/>',
    ];
    return '<svg class="icon '.htmlspecialchars($class).'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'.($paths[$name] ?? $paths['shield']).'</svg>';
}
