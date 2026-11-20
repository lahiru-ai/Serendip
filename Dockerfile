# Build stage: Maven with Eclipse Temurin Java 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and compile jar
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage: Lightweight Eclipse Temurin JRE 21
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Run as non-root user for security best practices
RUN addgroup -S serendip && adduser -S serendip -G serendip

# Copy compiled executable JAR
COPY --from=builder /app/target/*.jar app.jar

RUN chown -R serendip:serendip /app
USER serendip

EXPOSE 8080

# Configure JVM flags optimized for container environments
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
