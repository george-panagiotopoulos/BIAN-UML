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
from typing import Union
import re

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
        large_fonts = data.get('large_fonts', False)  # Flag for large fonts
        
        # Debug: Print all received data
        print(f"🔍 Received request data: large_fonts={large_fonts} (type: {type(large_fonts)}), format='{output_format}' (type: {type(output_format)})")
        
        # If large fonts requested, modify UML content for bigger font sizes
        if large_fonts:
            print(f"✅ Large fonts condition met: {large_fonts}, format: {output_format}")
            original_length = len(uml_content)
            uml_content = enhance_uml_for_large_fonts(uml_content)
            print(f"📝 UML content enhanced from {original_length} to {len(uml_content)} characters")
        else:
            print(f"ℹ️  Normal fonts: large_fonts={large_fonts}, format={output_format}")
        
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

def enforce_svg_white_background(svg_text: str) -> str:
    """Ensure the returned SVG has a white background regardless of theme."""
    if not svg_text:
        return svg_text

    updated = svg_text

    # 1) Ensure the root svg tag has a white background style
    if '<svg' in updated and 'background' not in updated.split('>')[0]:
        updated = updated.replace('<svg', '<svg style="background:#FFFFFF"', 1)

    # 2) Insert a white rect covering the viewBox/canvas right after the <svg ...>
    has_rect = re.search(r'<rect[^>]+fill\s*=\s*"#?fff', updated, flags=re.IGNORECASE) is not None
    if not has_rect:
        # Try to extract explicit width/height from svg or viewBox
        m_vb = re.search(r'viewBox\s*=\s*"([^"]+)"', updated)
        rect_tag = '<rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF"/>'
        updated = re.sub(r'(<svg[^>]*>)', r"\1" + rect_tag, updated, count=1)

    return updated

def enhance_uml_for_large_fonts(uml_content):
    """Enhance UML content with larger font specifications for better readability"""
    try:
        print("🔧 Enhancing UML content for large fonts...")
        lines = uml_content.split('\n')
        enhanced_lines = []
        
        # Add font size configuration at the beginning
        for line in lines:
            if line.strip().startswith('@startuml'):
                enhanced_lines.append(line)
                # Use PlantUML's native scale + force white background
                enhanced_lines.append('')
                enhanced_lines.append('skinparam BackgroundColor white')
                enhanced_lines.append('scale 1.5')
                enhanced_lines.append('')
                print("✅ Added PlantUML scale directive for 1.5x enlargement")
            else:
                # Skip any existing theme or layout commands that might interfere
                line_stripped = line.strip()
                if (line_stripped.startswith('!define LAYOUT') or 
                    line_stripped.startswith('!theme') or
                    line_stripped.startswith('skinparam BackgroundColor')):
                    print(f"🚫 Skipping existing styling command: {line_stripped}")
                    continue
                enhanced_lines.append(line)
        
        result = '\n'.join(enhanced_lines)
        print(f"✅ Enhanced UML content created with {len(enhanced_lines)} lines")
        
        # Show first few lines of enhanced content for debugging
        first_lines = '\n'.join(enhanced_lines[:10])
        print(f"📋 First 10 lines of enhanced UML:\n{first_lines}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error enhancing UML for large fonts: {e}")
        return uml_content  # Return original if enhancement fails

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
        # Helper: detect if returned SVG is an error image produced by PlantUML
        def is_error_svg(svg_text: str) -> bool:
            if not svg_text:
                return True
            indicators = [
                "An error has occured",  # legacy spelling from PlantUML
                "An error has occurred",
                "GraphViz",
                "plantuml.com/qa",
                "java.lang.",
                "UnparsableGraphvizException",
            ]
            return any(indicator in svg_text for indicator in indicators)

        # Helper: run PlantUML via stdin/stdout (no temp files)
        def run_plantuml_pipe(graphviz_dot: Union[str, None]):
            cmd = [
                'java',
                '-Djava.awt.headless=true',
            ]
            if graphviz_dot is None:
                # auto-detect
                pass
            elif graphviz_dot == "":
                # Disable GraphViz completely (empty property)
                cmd.append('-DGRAPHVIZ_DOT=')
            else:
                cmd.append(f'-DGRAPHVIZ_DOT={graphviz_dot}')

            cmd += [
                '-jar', str(PLANTUML_JAR),
                f'-t{output_format}',
                '-charset', 'UTF-8',
                '-pipe',
            ]

            # For SVG we can capture as text; for PNG/JPG capture bytes
            capture_as_text = (output_format == 'svg')
            try:
                result = subprocess.run(
                    cmd,
                    input=uml_content if capture_as_text else uml_content.encode('utf-8'),
                    capture_output=True,
                    text=capture_as_text,
                    timeout=30
                )
                print(f"🧪 PIPE try ({graphviz_dot if graphviz_dot is not None else 'auto'}): exit={result.returncode}")
                if result.stderr:
                    print(f"⚠️  PIPE stderr: {result.stderr}")
                    err_text = result.stderr if isinstance(result.stderr, str) else result.stderr.decode('utf-8', 'ignore')
                    error_indicators = [
                        'Cannot run program',
                        'No such file or directory',
                        'UnparsableGraphvizException',
                        'java.lang.IllegalStateException',
                    ]
                    if any(x in err_text for x in error_indicators):
                        return { 'success': False, 'error': err_text }

                if result.returncode != 0:
                    return { 'success': False, 'error': result.stderr or 'Non-zero exit' }

                content = result.stdout if capture_as_text else result.stdout  # stdout contains bytes when text=False
                if not capture_as_text:
                    # When text=False, result.stdout is bytes
                    content = result.stdout

                if output_format == 'svg' and isinstance(content, str) and is_error_svg(content):
                    return { 'success': False, 'error': 'PlantUML returned error SVG' }

                # Heuristic: very small PNG likely error
                if output_format == 'png' and isinstance(content, (bytes, bytearray)) and len(content) < 1000:
                    return { 'success': False, 'error': 'PNG too small from PIPE' }

                return { 'success': True, 'content': content }

            except subprocess.TimeoutExpired:
                return { 'success': False, 'error': 'PIPE timeout' }
            except Exception as e:
                return { 'success': False, 'error': f'PIPE exception: {e}' }

        # Ensure output directory exists
        OUTPUT_DIR.mkdir(exist_ok=True)

        # Create per-run output subdirectory to avoid cross-run collisions
        unique_id = str(uuid.uuid4())[:8]
        RUN_DIR = OUTPUT_DIR / f"run_{unique_id}"
        RUN_DIR.mkdir(exist_ok=True)

        # Create unique filename inside run dir
        input_file = RUN_DIR / f"diagram_{unique_id}.puml"
        
        # Write UML content to file
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(uml_content)
        
        print(f"📝 Created input file: {input_file}")
        
        # First attempt: PIPE mode (no filesystem). Prefer detected PATH GraphViz, skip non-existent hardcoded paths
        detected = check_graphviz_installations()
        detected_paths = [inst['path'] for inst in detected if os.path.exists(inst['path'])]
        hardcoded_paths = [p for p in ['/opt/homebrew/bin/dot', '/usr/local/bin/dot'] if os.path.exists(p)]
        pipe_attempts = detected_paths + hardcoded_paths + [None, ""]
        for gv in pipe_attempts:
            pipe_res = run_plantuml_pipe(gv)
            if pipe_res.get('success'):
                return {
                    'success': True,
                    'content': pipe_res['content'],
                    'format': output_format,
                    'method': f'pipe:{gv if gv is not None else "auto"}'
                }
            else:
                print(f"❌ PIPE attempt failed ({gv if gv is not None else 'auto'}): {pipe_res.get('error')}")

        # Fallback: file-based generation to support environments where -pipe might fail
        base_cmd = [
            'java', '-Djava.awt.headless=true', '-jar', str(PLANTUML_JAR),
            f'-t{output_format}',
            '-charset', 'UTF-8',
            '-o', str(RUN_DIR),
        ]
        
        # Try different GraphViz configurations: prefer detected PATH first
        execution_attempts = []
        for dot_path in detected_paths + hardcoded_paths:
            execution_attempts.append((f"with GraphViz at {dot_path}", base_cmd + [f'-DGRAPHVIZ_DOT={dot_path}', str(input_file)]))
        # Auto-detect
        execution_attempts.append(("with Auto-detect GraphViz", base_cmd + [str(input_file)]))
        # Disable GraphViz (empty property value - no quotes)
        execution_attempts.append(("without GraphViz", base_cmd + ['-DGRAPHVIZ_DOT=', str(input_file)]))
        
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
                
                # Treat GraphViz exceptions in stderr as failure even if exit code is 0
                err_text = result.stderr or ""
                if any(token in err_text for token in [
                    'UnparsableGraphvizException',
                    'java.lang.IllegalStateException',
                    'Cannot run program',
                    'No such file or directory'
                ]):
                    print(f"❌ Treating as failure due to GraphViz error in stderr for {attempt_name}")
                    continue

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
        
        # Only consider files with the unique stem to avoid picking unrelated outputs
        all_output_files = list(RUN_DIR.glob(f"{input_file.stem}*.{output_format}"))
        print(f"📁 Candidate {output_format} files for this run: {[str(f.name) for f in all_output_files]}")
        if all_output_files:
            newest_file = max(all_output_files, key=lambda f: f.stat().st_mtime)
            possible_output_files.insert(0, newest_file)
        
        output_file = None
        for possible_file in possible_output_files:
            if possible_file.exists():
                output_file = possible_file
                print(f"✅ Found output file: {output_file}")
                break
        
        if not output_file:
            # No output file generated despite successful exit; fallback gracefully
            if output_format == 'svg':
                print("⚠️ No SVG produced; returning text-based fallback SVG")
                return generate_text_fallback_diagram(uml_content)
            if output_format == 'png':
                print("⚠️ No PNG produced; generating text-based SVG then converting to PNG")
                svg_fb = generate_text_fallback_diagram(uml_content)
                if svg_fb.get('success'):
                    png_conv = convert_svg_to_png(svg_fb['content'])
                    if png_conv.get('success'):
                        return {
                            'success': True,
                            'content': png_conv['content'],
                            'format': 'png',
                            'method': f"text-fallback SVG -> PNG via {png_conv.get('method','unknown')}"
                        }
                return {
                    'success': False,
                    'error': 'Failed to generate output via PlantUML and fallback conversion'
                }
            # Other formats unsupported for fallback
            all_files = [f.name for f in RUN_DIR.iterdir()]
            expected_names = [str(p.name) for p in possible_output_files]
            return {
                'success': False,
                'error': (
                    'Output file not generated. '
                    f'Expected one of: {expected_names}. '
                    f'All files in {RUN_DIR}: {all_files}'
                )
            }
        
        # Read generated content
        if output_format == 'svg':
            with open(output_file, 'r', encoding='utf-8') as f:
                content = f.read()
            # Detect error SVGs and fallback to text-based simplified SVG
            if content and is_error_svg(content):
                print("⚠️ Detected PlantUML error SVG. Using text-based fallback.")
                return generate_text_fallback_diagram(uml_content)
            # Enforce white background for SVG content
            try:
                content = enforce_svg_white_background(content)
            except Exception as e:
                print(f"⚠️ Failed to enforce white background on SVG: {e}")
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

        # Optional: clean run directory if empty
        try:
            remaining = list(RUN_DIR.iterdir())
            if len(remaining) == 1 and remaining[0] == output_file:
                # keep output; otherwise leave run dir contents for debugging
                pass
        except Exception as _:
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
