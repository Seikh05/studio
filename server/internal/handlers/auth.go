package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Seikh05/studio/internal/database"
	"github.com/Seikh05/studio/internal/models"
	"github.com/Seikh05/studio/internal/utils"
	"github.com/go-playground/validator/v10"
)

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type RegisterRequest struct {
	FullName string `json:"full_name" validate:"required,min=2"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type AuthResponse struct {
	Token   string      `json:"token"`
	User    models.User `json:"user"`
	Message string      `json:"message"`
}

func Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.FullName == "" || req.Email == "" || req.Password == "" {
		http.Error(w, "all fields are required", http.StatusBadRequest)
		return
	}

	var existingUser models.User
	result := database.DB.Where("email = ?", req.Email).First(&existingUser)

	if result.Error == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	newuser := models.User{
		FullName: req.FullName,
		Email:    req.Email,
		Password: hashedPassword,
	}
	if err := database.DB.Create(&newuser).Error; err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	token, err := utils.GenerateToken(newuser.ID)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	response := AuthResponse{
		Token:   token,
		User:    newuser,
		Message: "User registered successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(response)

	if err != nil {
		http.Error(w," failed to encode response", http.StatusInternalServerError)
	}

}

func Login(w http.ResponseWriter, r *http.Request) {

    var req LoginRequest
    err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(w," unable to parse the requests",http.StatusBadRequest)
		return
	}



	if req.Email == "" || req.Password == "" {
       http.Error(w," provide the user credentials",http.StatusBadRequest)
	   return
	}

	var validate = validator.New()

	err = validate.Struct(req)

	if err != nil {
		http.Error(w, "invalid input :"+ err.Error(), http.StatusBadRequest)
		return
	}


	var user models.User
	result := database.DB.Where("email = ?", req.Email).First(&user)

	if result.Error != nil {
		http.Error(w, "user doesn't exist", http.StatusBadRequest)
		return
	}

	 passwordMatched := utils.CheckPassword(user.Password, req.Password)
	
	if !passwordMatched {
		http.Error(w, "Password not matched", http.StatusBadRequest)
		return
	}


	token , err := utils.GenerateToken(user.ID)

	if err != nil {
		http.Error(w," unable to generate token ",http.StatusBadRequest)
		return
	}

	response := AuthResponse{
		Token: token,
		User: user,
		Message: "user logged in successfully",

	}
    
	w.Header().Set("Content-Type","application-json")
	w.WriteHeader(http.StatusCreated)
    err = json.NewEncoder(w).Encode(response)

	if err != nil {
		http.Error(w," failed to encode the response ", http.StatusInternalServerError)
	}

}
