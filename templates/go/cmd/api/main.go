package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"qwykz-app/internal/handlers"
)

func main() {
	app := fiber.New()

	app.Get("/health", handlers.HealthCheck)

	log.Fatal(app.Listen(":3000"))
}
