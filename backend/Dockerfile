# Utilizamos una imagen base de Node.js de Alpine Linux (liviana)
FROM node:18-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos el package.json y lock (si existe) para instalar las dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto de los archivos del proyecto
COPY . .

# Exponemos el puerto donde escuchará nuestra aplicación (ajusta según tu configuración)
EXPOSE 5000

# Comandos para iniciar la aplicación (ajusta según tu script de inicio)
CMD [ "npm", "start" ]%              



