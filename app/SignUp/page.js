"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Tooltip,
  Spinner,
} from "@nextui-org/react";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";

    if (
      formData.email &&
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)
    ) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) newErrors.password = "Password is required";

    if (
      formData.password &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must be 8-20 characters, include 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!validate()) return; // Stop submission if form is invalid

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Registration successful!");
        setFormData({ name: "", email: "", password: "" }); // Reset form fields
      } else {
        console.log(data)
        setErrors({
          apiError: data.error || "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      setErrors({
        apiError: "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-4 shadow-md">
        <CardBody>
          <h2 className="text-center text-2xl font-semibold mb-6">Sign Up</h2>

          {errors.apiError && (
            <p className="text-center text-red-500">{errors.apiError}</p>
          )}
          {successMessage && (
            <p className="text-center text-green-500">{successMessage}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                type="text"
                name="name"
                label="Name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={errors.name}
                description={errors.name}
                fullWidth
              />
            </div>

            <div className="mb-4">
              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={errors.email}
                description={errors.email}
                fullWidth
              />
            </div>

            <div className="mb-6">
              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={errors.password}
                description={errors.password}
                fullWidth
              />
            </div>

            <Button
              type="submit"
              fullWidth
              isDisabled={isSubmitting}
              color="primary"
            >
              {isSubmitting ? <Spinner size="small" /> : "Sign Up"}
            </Button>
          </form>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <a href="/SignIn" className="text-blue-500">
              Sign In
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;
