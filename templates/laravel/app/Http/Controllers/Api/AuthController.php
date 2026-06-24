<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if (count($request->all()) > count($validated)) {
            return response()->json(['message' => 'Invalid payload. Only required fields are allowed.'], 400);
        }

        $result = $this->authService->register($validated);

        return response()->json($result, 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (count($request->all()) > count($validated)) {
            return response()->json(['message' => 'Invalid payload. Only required fields are allowed.'], 400);
        }

        $result = $this->authService->login($validated);

        return response()->json($result, 200);
    }
}
