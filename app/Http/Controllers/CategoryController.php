<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::with('parent')
            ->orderBy('type')
            ->orderBy('name');

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->get();

        return response()->json($categories);
    }

    /**
     * Store a new category
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'type' => $request->type,
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category->load('parent')
        ], 201);
    }

    /**
     * Display the specified category
     */
    public function show(Category $category): JsonResponse
    {
        $category->load(['parent', 'children']);

        return response()->json($category);
    }

    /**
     * Update the specified category
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:income,expense',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $category->update($request->only([
            'name',
            'type',
            'parent_id',
            'description',
            'is_active'
        ]));

        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $category->load('parent')
        ]);
    }

    /**
     * Remove the specified category
     */
    public function destroy(Category $category): JsonResponse
    {
        // Check if category has cash flows
        if ($category->cashFlows()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category that has cash flow entries'
            ], 422);
        }

        // Check if category has children
        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category that has sub-categories'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully'
        ]);
    }

    /**
     * Get income categories
     */
    public function getIncomeCategories(): JsonResponse
    {
        $categories = Category::getIncomeCategories();
        return response()->json($categories);
    }

    /**
     * Get expense categories
     */
    public function getExpenseCategories(): JsonResponse
    {
        $categories = Category::getExpenseCategories();
        return response()->json($categories);
    }

    /**
     * Toggle category active status
     */
    public function toggleActive(Category $category): JsonResponse
    {
        $category->update([
            'is_active' => !$category->is_active
        ]);

        return response()->json([
            'message' => 'Category status updated successfully',
            'data' => $category
        ]);
    }
}
