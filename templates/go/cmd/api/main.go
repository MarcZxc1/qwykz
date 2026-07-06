package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"qwykz-app/internal/database"
	"qwykz-app/internal/handlers"
	"qwykz-app/internal/middleware"
	"qwykz-app/internal/models"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// Initialize Database connection
	database.Connect()

	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowCredentials: true,
	}))



	// API Routes Group
	api := app.Group("/api")

	// Basic health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

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
