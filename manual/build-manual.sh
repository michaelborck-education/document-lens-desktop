#!/bin/bash
#
# Build Document Lens User Manual PDF
#
# This script:
# 1. Copies documentation from public/docs/ (single source of truth)
# 2. Dynamically generates _quarto.yml with chapter list
# 3. Renders PDF using Quarto with Typst
#
# Usage: ./manual/build-manual.sh
#
# Requirements: quarto, typst (quarto install tinytex not needed with typst)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_SOURCE="$PROJECT_ROOT/public/docs"
BUILD_DIR="$SCRIPT_DIR/build"
OUTPUT_DIR="$PROJECT_ROOT"

# Chapter order configuration
# Add new docs here in the order they should appear
# Format: "source-filename.md:Chapter Title"
CHAPTERS=(
    "user-guide.md:User Guide"
    "quick-reference.md:Quick Reference"
    "analysis-workflows.md:Analysis Workflows"
    "collaboration.md:Collaboration"
)

echo "Building Document Lens User Manual..."
echo "Source: $DOCS_SOURCE"
echo "Build:  $BUILD_DIR"

# Create/clean build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy index.qmd
cp "$SCRIPT_DIR/index.qmd" "$BUILD_DIR/"

# Copy and prepare chapter files
CHAPTER_LIST=""
for chapter in "${CHAPTERS[@]}"; do
    IFS=':' read -r filename title <<< "$chapter"
    source_file="$DOCS_SOURCE/$filename"

    if [[ -f "$source_file" ]]; then
        # Convert to .qmd extension
        qmd_filename="${filename%.md}.qmd"
        dest_file="$BUILD_DIR/$qmd_filename"

        # Copy file
        cp "$source_file" "$dest_file"

        # Add to chapter list for YAML
        CHAPTER_LIST="$CHAPTER_LIST    - $qmd_filename
"
        echo "  Added: $filename -> $qmd_filename"
    else
        echo "  Warning: $filename not found, skipping"
    fi
done

# Check for any docs not in CHAPTERS list (auto-discover new docs)
for doc in "$DOCS_SOURCE"/*.md; do
    if [[ -f "$doc" ]]; then
        basename_doc=$(basename "$doc")
        found=false
        for chapter in "${CHAPTERS[@]}"; do
            IFS=':' read -r filename title <<< "$chapter"
            if [[ "$filename" == "$basename_doc" ]]; then
                found=true
                break
            fi
        done
        if [[ "$found" == "false" ]]; then
            echo "  Note: $basename_doc exists but is not in CHAPTERS list"
            echo "        Add it to build-manual.sh to include in PDF"
        fi
    fi
done

# Get version from package.json
VERSION=$(grep '"version"' "$PROJECT_ROOT/package.json" | sed 's/.*"version": "\(.*\)".*/\1/')
DATE=$(date +"%B %Y")

# Generate _quarto.yml
cat > "$BUILD_DIR/_quarto.yml" << EOF
project:
  type: book
  output-dir: _output

book:
  title: "Document Lens User Manual"
  subtitle: "Batch PDF Analysis for Sustainability Research"
  author: "Document Lens Team"
  date: "$DATE"
  chapters:
    - index.qmd
$CHAPTER_LIST

format:
  pdf:
    pdf-engine: typst
    toc: true
    toc-depth: 3
    number-sections: true
    papersize: a4
    margin:
      top: 25mm
      bottom: 25mm
      left: 25mm
      right: 25mm
    mainfont: "Libertinus Serif"
    sansfont: "Libertinus Sans"
    monofont: "DejaVu Sans Mono"
EOF

echo ""
echo "Generated _quarto.yml with $(echo "$CHAPTER_LIST" | grep -c qmd) chapters"

# Render the book
echo ""
echo "Rendering PDF with Quarto + Typst..."
cd "$BUILD_DIR"
quarto render --to pdf

# Copy output to project root
OUTPUT_PDF="$BUILD_DIR/_output/Document-Lens-User-Manual.pdf"
if [[ -f "$OUTPUT_PDF" ]]; then
    cp "$OUTPUT_PDF" "$OUTPUT_DIR/Document-Lens-User-Manual.pdf"
    echo ""
    echo "Success! PDF created:"
    echo "  $OUTPUT_DIR/Document-Lens-User-Manual.pdf"
else
    # Try alternate output name
    OUTPUT_PDF=$(find "$BUILD_DIR/_output" -name "*.pdf" | head -1)
    if [[ -f "$OUTPUT_PDF" ]]; then
        cp "$OUTPUT_PDF" "$OUTPUT_DIR/Document-Lens-User-Manual.pdf"
        echo ""
        echo "Success! PDF created:"
        echo "  $OUTPUT_DIR/Document-Lens-User-Manual.pdf"
    else
        echo ""
        echo "Error: PDF not found in output directory"
        ls -la "$BUILD_DIR/_output/" 2>/dev/null || echo "Output directory does not exist"
        exit 1
    fi
fi
