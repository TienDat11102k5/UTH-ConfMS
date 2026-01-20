@echo off
REM Script to run Backend Unit Tests on Windows
REM Usage: run-tests.bat [options]

echo =========================================
echo   UTH-ConfMS Backend Unit Tests
echo =========================================
echo.

REM Default options
set COVERAGE=false
set SPECIFIC_TEST=

REM Parse arguments
:parse_args
if "%1"=="" goto run_tests
if "%1"=="--coverage" (
    set COVERAGE=true
    shift
    goto parse_args
)
if "%1"=="--test" (
    set SPECIFIC_TEST=%2
    shift
    shift
    goto parse_args
)
if "%1"=="--help" (
    echo Usage: run-tests.bat [options]
    echo.
    echo Options:
    echo   --coverage          Generate test coverage report
    echo   --test ^<TestName^>   Run specific test class
    echo   --help              Show this help message
    echo.
    echo Examples:
    echo   run-tests.bat                              # Run all tests
    echo   run-tests.bat --coverage                   # Run with coverage
    echo   run-tests.bat --test AuthServiceTest       # Run specific test
    exit /b 0
)
echo Unknown option: %1
echo Use --help for usage information
exit /b 1

:run_tests
REM Run tests
if not "%SPECIFIC_TEST%"=="" (
    echo Running specific test: %SPECIFIC_TEST%
    echo.
    call mvnw.cmd test -Dtest=%SPECIFIC_TEST%
) else (
    echo Running all tests...
    echo.
    if "%COVERAGE%"=="true" (
        echo With coverage report...
        call mvnw.cmd clean test jacoco:report
    ) else (
        call mvnw.cmd test
    )
)

REM Check exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================
    echo   [32m✓ All tests passed![0m
    echo =========================================
    
    if "%COVERAGE%"=="true" (
        echo.
        echo Coverage report generated at:
        echo   target\site\jacoco\index.html
        echo.
        echo Open in browser:
        echo   file:///%CD%\target\site\jacoco\index.html
    )
) else (
    echo.
    echo =========================================
    echo   [31m✗ Some tests failed![0m
    echo =========================================
    exit /b 1
)
