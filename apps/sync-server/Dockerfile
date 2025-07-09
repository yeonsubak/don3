FROM eclipse-temurin:21-jre-alpine
LABEL authors="yeonsubak@gmail.com"

WORKDIR /app

COPY build/libs/sync*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]