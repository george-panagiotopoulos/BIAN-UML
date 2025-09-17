#!/usr/bin/env python3
"""
Flask web server for BIAN UML Visualizer
Serves the HTML interface and provides API endpoints for UML file access
"""

from flask import Flask, render_template, send_from_directory, jsonify, request, Response
import os
import sys
import subprocess
import tempfile
import uuid
from pathlib import Path

app = Flask(__name__)

# Configure paths
BASE_DIR = Path(__file__).parent
PUML_DIR = BASE_DIR.parent / "ModularLandscape" / "PUML"
STATIC_DIR = BASE_DIR
PLANTUML_JAR = BASE_DIR.parent / "plantuml.jar"
OUTPUT_DIR = BASE_DIR / "png"  # Local directory for PlantUML output

# Configure Flask
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development

@app.route('/')
def index():
    """Serve the main HTML interface"""
    return send_from_directory(STATIC_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory(STATIC_DIR, filename)

@app.route('/api/diagrams')
def get_available_diagrams():
    """Get list of available UML diagrams"""
    diagrams = []
    
    if PUML_DIR.exists():
        for puml_file in PUML_DIR.glob("*.puml"):
            diagrams.append({
                'filename': puml_file.name,
                'name': puml_file.stem,
                'path': str(puml_file.relative_to(BASE_DIR.parent))
            })
    
    return jsonify(diagrams)

@app.route('/api/diagram/<filename>')
def get_diagram_content(filename):
    """Get content of a specific UML diagram"""
    try:
        file_path = PUML_DIR / filename
        
        if not file_path.exists():
            return jsonify({'error': f'File {filename} not found'}), 404
        
        if not file_path.suffix == '.puml':
            return jsonify({'error': 'Invalid file type'}), 400
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return jsonify({
            'filename': filename,
            'content': content,
            'size': len(content)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ModularLandscape/PUML/<filename>')
def serve_puml_file(filename):
    """Serve PUML files directly (for compatibility with existing JS)"""
    try:
        file_path = PUML_DIR / filename
        
        if not file_path.exists():
            return f"File {filename} not found", 404
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
    
    except Exception as e:
        return f"Error reading file: {str(e)}", 500

@app.route('/api/generate-diagram', methods=['POST'])
def generate_diagram():
    """Generate UML diagram using local plantuml.jar"""
    try:
        # Get UML content from request
        data = request.get_json()
        if not data or 'uml_content' not in data:
            return jsonify({'error': 'No UML content provided'}), 400
        
        uml_content = data['uml_content']
        output_format = data.get('format', 'svg')  # svg, png, etc.
        
        # Validate PlantUML jar exists
        if not PLANTUML_JAR.exists():
            return jsonify({'error': f'PlantUML jar not found at {PLANTUML_JAR}'}), 500
        
        # Generate diagram using PlantUML jar
        result = generate_plantuml_diagram(uml_content, output_format)
        
        if result['success']:
            # Determine proper MIME type
            if output_format == 'svg':
                mimetype = 'image/svg+xml'
            elif output_format == 'png':
                mimetype = 'image/png'
            elif output_format == 'jpg' or output_format == 'jpeg':
                mimetype = 'image/jpeg'
            else:
                mimetype = f'image/{output_format}'
            
            # Return the generated image
            return Response(
                result['content'],
                mimetype=mimetype,
                headers={
                    'Content-Disposition': f'inline; filename="diagram.{output_format}"',
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*'
                }
            )
        else:
            return jsonify({'error': result['error']}), 500
            
    except Exception as e:
        return jsonify({'error': f'Error generating diagram: {str(e)}'}), 500

def convert_svg_to_png(svg_content):
    """Convert SVG content to PNG using Python libraries as fallback"""
    try:
        # Try using cairosvg if available
        try:
            import cairosvg
            png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'))
            return {
                'success': True,
                'content': png_data,
                'method': 'cairosvg'
            }
        except ImportError:
            pass
        
        # Try using wand (ImageMagick) if available
        try:
            from wand.image import Image
            from wand.color import Color
            
            with Image() as img:
                img.format = 'svg'
                img.read(blob=svg_content.encode('utf-8'))
                img.format = 'png'
                img.background_color = Color('white')
                png_data = img.make_blob()
                return {
                    'success': True,
                    'content': png_data,
                    'method': 'wand'
                }
        except ImportError:
            pass
        
        # Try using Pillow with svg2rlg if available
        try:
            from reportlab.graphics import renderPM
            from svglib.svglib import renderSVG
            import io
            
            # Convert SVG to ReportLab drawing
            svg_file = io.StringIO(svg_content)
            drawing = renderSVG.renderSVG(svg_file)
            
            # Render to PNG
            png_data = renderPM.drawToPIL(drawing, fmt='PNG')
            img_buffer = io.BytesIO()
            png_data.save(img_buffer, format='PNG')
            
            return {
                'success': True,
                'content': img_buffer.getvalue(),
                'method': 'reportlab'
            }
        except ImportError:
            pass
        
        return {
            'success': False,
            'error': 'No SVG to PNG conversion libraries available. Install cairosvg, wand, or reportlab+svglib.'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'SVG to PNG conversion failed: {str(e)}'
        }

def generate_plantuml_diagram(uml_content, output_format='svg'):
    """Generate diagram using local PlantUML jar with local output directory"""
    try:
        # Ensure output directory exists
        OUTPUT_DIR.mkdir(exist_ok=True)
        
        # Create unique filename
        unique_id = str(uuid.uuid4())[:8]
        input_file = OUTPUT_DIR / f"diagram_{unique_id}.puml"
        
        # Write UML content to file
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(uml_content)
        
        print(f"📝 Created input file: {input_file}")
        
        # Prepare PlantUML command - output to the same directory
        # Try different approaches based on format and complexity
        base_cmd = [
            'java', '-jar', str(PLANTUML_JAR),
            f'-t{output_format}',  # Output format
            '-charset', 'UTF-8',   # Character encoding
            '-o', str(OUTPUT_DIR), # Output directory
        ]
        
        # Try different GraphViz configurations
        # 1. Try with Homebrew GraphViz path
        homebrew_dot_path = '/opt/homebrew/bin/dot'
        cmd_homebrew_graphviz = base_cmd + [
            f'-DGRAPHVIZ_DOT={homebrew_dot_path}',
            str(input_file)
        ]
        
        # 2. Try with system GraphViz
        system_dot_path = '/usr/local/bin/dot'
        cmd_system_graphviz = base_cmd + [
            f'-DGRAPHVIZ_DOT={system_dot_path}',
            str(input_file)
        ]
        
        # 3. Try with default GraphViz (auto-detect)
        cmd_auto_graphviz = base_cmd + [str(input_file)]
        
        # 4. Try without GraphViz (fallback)
        cmd_no_graphviz = base_cmd + [
            '-DGRAPHVIZ_DOT=""',
            str(input_file)
        ]
        
        # Try multiple execution strategies in order of preference
        execution_attempts = [
            ("with Homebrew GraphViz", cmd_homebrew_graphviz),
            ("with System GraphViz", cmd_system_graphviz), 
            ("with Auto-detect GraphViz", cmd_auto_graphviz),
            ("without GraphViz", cmd_no_graphviz),
        ]
        
        result = None
        successful_cmd = None
        
        for attempt_name, cmd in execution_attempts:
            print(f"🔧 Trying {attempt_name}: {' '.join(cmd)}")
            
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30  # 30 second timeout
                )
                
                print(f"📊 PlantUML exit code: {result.returncode}")
                if result.stdout:
                    print(f"📋 PlantUML stdout: {result.stdout}")
                if result.stderr:
                    print(f"⚠️  PlantUML stderr: {result.stderr}")
                
                if result.returncode == 0:
                    successful_cmd = attempt_name
                    print(f"✅ Success with {attempt_name}")
                    break
                else:
                    print(f"❌ Failed with {attempt_name}")
                    
            except subprocess.TimeoutExpired:
                print(f"⏱️ Timeout with {attempt_name}")
                continue
            except Exception as e:
                print(f"💥 Exception with {attempt_name}: {e}")
                continue
        
        if not result or result.returncode != 0:
            error_msg = result.stderr if result else "All execution attempts failed"
            
            # For PNG, try generating SVG first then converting
            if output_format == 'png':
                print("🔄 PNG failed, trying SVG generation then conversion...")
                svg_result = generate_plantuml_diagram(uml_content, 'svg')
                if svg_result['success']:
                    print("✅ SVG generated, converting to PNG...")
                    png_result = convert_svg_to_png(svg_result['content'])
                    if png_result['success']:
                        print(f"✅ PNG conversion successful using {png_result['method']}")
                        return {
                            'success': True,
                            'content': png_result['content'],
                            'format': 'png',
                            'method': f"SVG->PNG via {png_result['method']}"
                        }
                    else:
                        print(f"❌ PNG conversion failed: {png_result['error']}")
            
            # Try text-based fallback for SVG
            if output_format == 'svg':
                print("🔄 Trying text-based fallback...")
                return generate_text_fallback_diagram(uml_content)
            
            return {
                'success': False,
                'error': f'PlantUML execution failed after all attempts. Last error: {error_msg}'
            }
        
        # Look for generated output file - PlantUML creates subdirectories
        # Check both the main output directory and nested subdirectories
        possible_output_files = [
            OUTPUT_DIR / f"diagram_{unique_id}.{output_format}",  # Direct in output dir
            OUTPUT_DIR / f"{input_file.stem}.{output_format}",   # Stem naming
            OUTPUT_DIR / "png" / f"diagram_{unique_id}.{output_format}",  # In nested subdir
            OUTPUT_DIR / "png" / f"{input_file.stem}.{output_format}",   # Stem in subdir
        ]
        
        # Scan all subdirectories for files with correct extension
        all_output_files = []
        for pattern in [f"*.{output_format}", f"**/*.{output_format}"]:
            all_output_files.extend(list(OUTPUT_DIR.glob(pattern)))
        
        print(f"📁 Found {output_format} files in output directory tree: {[str(f.relative_to(OUTPUT_DIR)) for f in all_output_files]}")
        
        # Find the most recently created file with correct extension
        if all_output_files:
            # Sort by modification time, get the newest
            newest_file = max(all_output_files, key=lambda f: f.stat().st_mtime)
            possible_output_files.insert(0, newest_file)
        
        output_file = None
        for possible_file in possible_output_files:
            if possible_file.exists():
                output_file = possible_file
                print(f"✅ Found output file: {output_file}")
                break
        
        if not output_file:
            all_files = list(OUTPUT_DIR.iterdir())
            return {
                'success': False,
                'error': f'Output file not generated. Expected: {expected_output_file}. All files in {OUTPUT_DIR}: {[f.name for f in all_files]}'
            }
        
        # Read generated content
        if output_format == 'svg':
            with open(output_file, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            with open(output_file, 'rb') as f:
                content = f.read()
        
        print(f"📄 Successfully read {len(content)} bytes from {output_file}")
        
        # Check if PNG is corrupted (very small file size indicates error)
        if output_format == 'png' and len(content) < 1000:  # Less than 1KB is likely corrupted
            print(f"⚠️ PNG file seems corrupted ({len(content)} bytes), trying SVG->PNG conversion...")
            svg_result = generate_plantuml_diagram(uml_content, 'svg')
            if svg_result['success']:
                print("✅ SVG generated, converting to PNG...")
                png_result = convert_svg_to_png(svg_result['content'])
                if png_result['success']:
                    print(f"✅ PNG conversion successful using {png_result['method']}")
                    # Clean up corrupted file
                    try:
                        output_file.unlink()
                        print(f"🗑️ Removed corrupted PNG: {output_file}")
                    except:
                        pass
                    
                    return {
                        'success': True,
                        'content': png_result['content'],
                        'format': 'png',
                        'method': f"SVG->PNG via {png_result['method']} (fallback)"
                    }
                else:
                    print(f"❌ PNG conversion failed: {png_result['error']}")
        
        # Clean up input file (but keep output for debugging)
        try:
            input_file.unlink()
            print(f"🧹 Cleaned up input file: {input_file}")
        except:
            pass
        
        return {
            'success': True,
            'content': content,
            'format': output_format,
            'output_file': str(output_file)
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'PlantUML execution timed out (30 seconds)'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Error during diagram generation: {str(e)}'
        }

@app.route('/health')
def health_check():
    """Health check endpoint"""
    graphviz_installations = check_graphviz_installations()
    return jsonify({
        'status': 'healthy',
        'puml_dir_exists': PUML_DIR.exists(),
        'puml_files_count': len(list(PUML_DIR.glob("*.puml"))) if PUML_DIR.exists() else 0,
        'plantuml_jar_exists': PLANTUML_JAR.exists(),
        'java_available': check_java_availability(),
        'graphviz_installations': graphviz_installations,
        'graphviz_available': len(graphviz_installations) > 0
    })

def generate_text_fallback_diagram(uml_content):
    """Generate a text-based fallback when PlantUML/GraphViz fails"""
    try:
        # Parse the UML content to extract key information
        lines = uml_content.strip().split('\n')
        title = "UML Diagram"
        elements = []
        relationships = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('title '):
                title = line[6:].strip()
            elif ' -> ' in line:
                parts = line.split(' -> ')
                if len(parts) == 2:
                    relationships.append((parts[0].strip(), parts[1].strip()))
            elif line.startswith('class ') or line.startswith('package '):
                elements.append(line)
        
        # Create a simple SVG-based text representation
        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" style="background:#f9f9f9;">
    <style>
        .title {{ font: bold 20px Arial; text-anchor: middle; }}
        .element {{ font: 14px Arial; }}
        .relationship {{ font: 12px Arial; }}
        .error {{ font: 12px Arial; fill: #d32f2f; }}
    </style>
    
    <!-- Title -->
    <text x="400" y="30" class="title">{title}</text>
    
    <!-- Error Message -->
    <text x="400" y="60" class="error" text-anchor="middle">
        GraphViz Compatibility Issue - Showing Simplified View
    </text>
    
    <!-- Elements -->"""
        
        y_pos = 100
        for i, element in enumerate(elements[:10]):  # Limit to 10 elements
            svg_content += f'\n    <text x="50" y="{y_pos}" class="element">{element}</text>'
            y_pos += 25
        
        # Relationships
        y_pos += 20
        svg_content += '\n    <text x="50" y="' + str(y_pos) + '" class="element">Relationships:</text>'
        y_pos += 25
        
        for relationship in relationships[:10]:  # Limit to 10 relationships
            svg_content += f'\n    <text x="70" y="{y_pos}" class="relationship">{relationship[0]} → {relationship[1]}</text>'
            y_pos += 20
        
        # Footer
        svg_content += f'''
    
    <!-- Footer -->
    <text x="400" y="550" class="error" text-anchor="middle">
        To fix: Update PlantUML jar or downgrade GraphViz
    </text>
    <text x="400" y="570" class="error" text-anchor="middle">
        Visit: https://plantuml.com/graphviz-dot
    </text>
</svg>'''
        
        return {
            'success': True,
            'content': svg_content,
            'format': 'svg',
            'fallback': True
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Even text fallback failed: {str(e)}'
        }

def check_graphviz_installations():
    """Check available GraphViz installations"""
    installations = []
    
    # Check common GraphViz installation paths
    paths_to_check = [
        '/opt/homebrew/bin/dot',  # Homebrew on Apple Silicon
        '/usr/local/bin/dot',     # Homebrew on Intel Mac / System install
        '/usr/bin/dot',           # System package manager
        'dot'                     # PATH environment
    ]
    
    for dot_path in paths_to_check:
        try:
            if dot_path == 'dot':
                # Check if dot is in PATH
                result = subprocess.run(['which', 'dot'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    actual_path = result.stdout.strip()
                    version_result = subprocess.run(['dot', '-V'], capture_output=True, text=True, timeout=5)
                    if version_result.returncode == 0:
                        installations.append({
                            'path': actual_path,
                            'type': 'PATH',
                            'version': version_result.stderr.strip() if version_result.stderr else 'Unknown'
                        })
            else:
                # Check specific path
                if os.path.exists(dot_path):
                    version_result = subprocess.run([dot_path, '-V'], capture_output=True, text=True, timeout=5)
                    if version_result.returncode == 0:
                        install_type = 'Homebrew' if '/homebrew/' in dot_path else 'System'
                        installations.append({
                            'path': dot_path,
                            'type': install_type,
                            'version': version_result.stderr.strip() if version_result.stderr else 'Unknown'
                        })
        except:
            continue
    
    return installations

def check_java_availability():
    """Check if Java is available for running PlantUML"""
    try:
        result = subprocess.run(['java', '-version'], capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except:
        return False

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Print startup information
    print("=" * 60)
    print("🚀 BIAN UML Visualizer Server Starting")
    print("=" * 60)
    print(f"📁 Base Directory: {BASE_DIR}")
    print(f"📁 PUML Directory: {PUML_DIR}")
    print(f"📊 PUML Files Found: {len(list(PUML_DIR.glob('*.puml'))) if PUML_DIR.exists() else 0}")
    print(f"🌐 Server URL: http://localhost:7777")
    print(f"🔍 Health Check: http://localhost:7777/health")
    print(f"📋 API Diagrams: http://localhost:7777/api/diagrams")
    print("=" * 60)
    
    # Verify PUML directory exists
    if not PUML_DIR.exists():
        print(f"⚠️  WARNING: PUML directory not found at {PUML_DIR}")
        print("   Make sure the ModularLandscape/PUML directory exists with .puml files")
    
    # Start the server
    try:
        app.run(
            host='0.0.0.0',  # Allow external connections
            port=7777,
            debug=True,      # Enable debug mode for development
            use_reloader=False  # Disable reloader to avoid double startup
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
