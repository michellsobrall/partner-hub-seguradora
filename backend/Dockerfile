# =======================================================
# Multi-stage Dockerfile - Partner Hub Backend (Spring Boot 3)
# =======================================================

# Estágio 1: Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Cache de dependências
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compilação e empacotamento
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: Runtime leve e seguro
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Cria usuário não-root para segurança
RUN addgroup -S partnerhub && adduser -S partnerhub -G partnerhub
USER partnerhub:partnerhub

COPY --from=builder --chown=partnerhub:partnerhub /app/target/*.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.awt.headless=true", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
