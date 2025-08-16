package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Seikh05/studio/internal/database"
	"github.com/Seikh05/studio/internal/handlers"
	"github.com/Seikh05/studio/internal/models"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {

	database.ConnectDB()

	err := database.DB.AutoMigrate(&models.User{})

	if err != nil {
		log.Fatalf("Error running automigrate for model: %v", err)
	}
	r := mux.NewRouter()

	r.HandleFunc("/", handlers.HomeHandler).Methods("GET")
	r.HandleFunc("/health", handlers.HealthHandler).Methods("GET")
	r.HandleFunc("/register", handlers.Register).Methods("POST")
	r.HandleFunc("/login", handlers.Login).Methods("POST")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:9002"}, 
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	fmt.Println("Server is starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
