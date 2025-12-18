.PHONY: help install test test-unit test-integration lint format docker-build docker-up docker-down clean

help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make test          - Run all tests"
	@echo "  make test-unit     - Run unit tests only"
	@echo "  make test-integration - Run integration tests only"
	@echo "  make lint          - Run linter"
	@echo "  make format        - Format code"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make clean         - Clean temporary files"

install:
	pip install --upgrade pip
	pip install -r requirements.txt

test:
	pytest tests/ -v

test-unit:
	pytest tests/ -v -m "not integration"

test-integration:
	pytest tests/integration/ -v

lint:
	flake8 src/ tests/ --max-line-length=120 --ignore=E203,W503
	mypy src/ --ignore-missing-imports

format:
	black src/ tests/ --line-length=120
	isort src/ tests/

docker-build:
	docker build -t uth-confms-ai-service:latest .

docker-up:
	docker-compose -f ../docker/docker-compose.yml up -d ai-service

docker-down:
	docker-compose -f ../docker/docker-compose.yml down ai-service

clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -r {} +
	rm -rf .pytest_cache/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf dist/
	rm -rf build/


