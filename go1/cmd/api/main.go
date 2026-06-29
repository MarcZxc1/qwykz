package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"qwykz-go-template/internal/database"
	"qwykz-go-template/internal/handlers"
	"qwykz-go-template/internal/middleware"
	"qwykz-go-template/internal/models"
)

func main() {
	// Initialize Database connection
	database.Connect()

	app := fiber.New()
	app.Use(logger.New())

	// Basic health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	// API Routes Group
	api := app.Group("/api")

	// Auth Routes
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// Example protected route showing RBAC usage
	api.Get("/admin-only", middleware.RequireRole(models.RoleAdmin), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Welcome Admin!"})
	})

	log.Fatal(app.Listen(":3000"))
}
