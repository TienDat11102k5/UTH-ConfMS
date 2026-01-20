#!/bin/bash

# Script to run Backend Unit Tests
# Usage: ./run-tests.sh [options]

echo "========================================="
echo "  UTH-ConfMS Backend Unit Tests"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default options
COVERAGE=false
SPECIFIC_TEST=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --test)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --help)
            echo "Usage: ./run-tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  --coverage          Generate test coverage report"
            echo "  --test <TestName>   Run specific test class"
            echo "  --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh                              # Run all tests"
            echo "  ./run-tests.sh --coverage                   # Run with coverage"
            echo "  ./run-tests.sh --test AuthServiceTest       # Run specific test"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run tests
if [ -n "$SPECIFIC_TEST" ]; then
    echo -e "${YELLOW}Running specific test: $SPECIFIC_TEST${NC}"
    echo ""
    ./mvnw test -Dtest=$SPECIFIC_TEST
else
    echo -e "${YELLOW}Running all tests...${NC}"
    echo ""
    if [ "$COVERAGE" = true ]; then
        echo -e "${YELLOW}With coverage report...${NC}"
        ./mvnw clean test jacoco:report
    else
        ./mvnw test
    fi
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}  ✓ All tests passed!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    
    if [ "$COVERAGE" = true ]; then
        echo ""
        echo -e "${YELLOW}Coverage report generated at:${NC}"
        echo "  target/site/jacoco/index.html"
        echo ""
        echo "Open in browser:"
        echo "  file://$(pwd)/target/site/jacoco/index.html"
    fi
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}  ✗ Some tests failed!${NC}"
    echo -e "${RED}=========================================${NC}"
    exit 1
fi
