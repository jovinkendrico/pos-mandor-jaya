<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class StoreLastIndexUrl
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only store for GET requests to index routes
        if ($request->isMethod('get') && $request->route() && str_ends_with($request->route()->getName(), '.index')) {
            $routeName = $request->route()->getName();
            $resource = explode('.', $routeName)[0];
            
            // Store the full URL with query parameters in session
            Session::put("last_index_url_{$resource}", $request->fullUrl());
        }

        return $response;
    }
}
