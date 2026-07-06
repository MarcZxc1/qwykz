package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/cors"
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
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowCredentials: true,
	}))

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

	// Users Routes
	api.Get("/users", handlers.GetUsers)

	// Example protected route showing RBAC usage
	api.Get("/admin-only", middleware.RequireRole(models.RoleAdmin), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Welcome Admin!"})
	})

	log.Fatal(app.Listen(":3000"))
}
