package handlers

import (
	"github.com/gofiber/fiber/v2"
	"qwykz-go-template/internal/database"
	"qwykz-go-template/internal/models"
)

func GetUsers(c *fiber.Ctx) error {
	var users []models.User
	if err := database.DB.Select("id, email, name, role, created_at, updated_at").Find(&users).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve users",
		})
	}
	return c.JSON(users)
}
