"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Spinner,
} from "@nextui-org/react";

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";

    if (
      formData.email &&
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)
    ) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Login successful!");
        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("name", data?.data?.name)
        setFormData({ email: "", password: "" });
        window.location.href = "/";
      } else {
        setErrors({
          apiError: data.error || "Login failed. Please try again.",
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md p-4 shadow-md">
        <CardBody>
          <h2 className="text-center text-2xl font-semibold mb-6">Sign In</h2>

          {errors.apiError && (
            <p className="text-center text-red-500">{errors.apiError}</p>
          )}
          {successMessage && (
            <p className="text-center text-green-500">{successMessage}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Input
                description={errors.email}
                fullWidth
                isInvalid={errors.email}
                label="Email"
                name="email"
                onChange={handleChange}
                placeholder="Enter your email"
                type="email"
                value={formData.email}
              />
            </div>

            <div className="mb-6">
              <Input
                description={errors.password}
                fullWidth
                isInvalid={errors.password}
                label="Password"
                name="password"
                onChange={handleChange}
                placeholder="Enter your password"
                type="password"
                value={formData.password}
              />
            </div>

            <Button
              color="primary"
              fullWidth
              isDisabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <Spinner size="small" /> : "Sign In"}
            </Button>
          </form>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/SignUp" className="text-blue-500">
              Sign Up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignInPage;
