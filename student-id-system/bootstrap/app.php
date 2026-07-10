<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))

    // =========================
    // ROUTES CONFIGURATION
    // =========================
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )

    // =========================
    // MIDDLEWARE CONFIGURATION
    // =========================
    ->withMiddleware(function (Middleware $middleware): void {

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

    })

    // =========================
    // EXCEPTIONS HANDLING
    // =========================
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })

    ->create();