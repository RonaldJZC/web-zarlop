import os
import re

html_files = [
    'dashboard.html',
    'correos.html',
    'cotizaciones.html',
    'nueva-cotizacion.html',
    'clientes.html',
    'configuracion.html'
]

replacement = """            <nav class="sidebar-menu">
                <div class="menu-label">Principal</div>
                <a href="dashboard.html" class="menu-item" data-id="dashboard.html"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> Dashboard</a>
                <a href="correos.html" class="menu-item" data-id="correos.html"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Bandeja de Correos</a>
                <a href="analizador.html" class="menu-item" data-id="analizador.html"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg> Analizador Inteligente</a>
                
                <div class="menu-label">Comercial</div>
                <a href="cotizaciones.html" class="menu-item" data-id="cotizaciones.html"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Cotizaciones</a>
                <a href="clientes.html" class="menu-item" data-id="clientes.html"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Directorio de Clientes</a>

                <div class="menu-label">Administración</div>
                <a href="configuracion.html" class="menu-item" data-id="configuracion.html"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Configuración del Sistema</a>
            </nav>"""

for f in html_files:
    file_path = os.path.join(r'd:\antigravity\web zarlop\sgd', f)
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    pattern = re.compile(r'<nav class="sidebar-menu">.*?</nav>', re.DOTALL)
    
    modified_replacement = replacement.replace(f'data-id="{f}"', f'class="menu-item active"')
    modified_replacement = re.sub(r'data-id="[^"]+"', '', modified_replacement)
    
    new_content = pattern.sub(modified_replacement, content)
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(new_content)
    print(f'Updated {f}')
