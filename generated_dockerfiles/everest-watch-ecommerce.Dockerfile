FROM php:8.1-fpm

WORKDIR /app

COPY Everest_Watch/composer.json ./
COPY Everest_Watch/composer.lock ./

RUN docker-php-ext-install pdo pdo_mysql mbstring
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN composer install --no-interaction --optimize-autoloader --no-dev

COPY Everest_Watch/ .

RUN chown -R www-data:www-data /app

EXPOSE 80

CMD ["php-fpm"]