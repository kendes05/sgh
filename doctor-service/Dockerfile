# Estágio 1: Compilação
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copia o POM e baixa dependências
COPY pom.xml .
RUN mvn dependency:go-offline

# Copia o código e gera o JAR
COPY src ./src
RUN mvn package -DskipTests

# Estágio 2: Execução
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]