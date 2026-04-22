# Etapa 1: build da aplicação
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copia só o pom primeiro (melhora cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Agora copia o resto
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: imagem final menor
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copia o jar gerado
COPY --from=build /app/target/*.jar app.jar

# Porta padrão do serviço
EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]