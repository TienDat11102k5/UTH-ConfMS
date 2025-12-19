FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml first and download dependencies (better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -o || mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]