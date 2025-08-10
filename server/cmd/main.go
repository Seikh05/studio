package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Seikh05/studio/internal/database"
	"github.com/Seikh05/studio/internal/handlers"
	"github.com/Seikh05/studio/internal/models"
	"github.com/gorilla/mux"
)

func main() {

	database.ConnectDB()

	database.DB.AutoMigrate(&models.User{})

	r := mux.NewRouter()

	r.HandleFunc("/", handlers.HomeHandler).Methods("GET")
	r.HandleFunc("/health", handlers.HealthHandler).Methods("GET")
	r.HandleFunc("/register",handlers.Register).Methods("POST")
	r.HandleFunc("/login",handlers.Login).Methods("GET")

	fmt.Println("Server is starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", r))
}


