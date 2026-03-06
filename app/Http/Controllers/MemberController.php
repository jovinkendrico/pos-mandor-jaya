<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Member::withCount('loans');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $members = $query->orderBy('name')->paginate(20)->withQueryString();

        return Inertia::render('master/member/index', [
            'members' => $members,
            'filters' => ['search' => $request->get('search', '')],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('master/member/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'notes'        => ['nullable', 'string'],
        ]);

        Member::create([
            'name'         => $request->name,
            'phone_number' => $request->phone_number,
            'notes'        => $request->notes,
            'created_by'   => auth()->id(),
            'updated_by'   => auth()->id(),
        ]);

        return redirect()->route('members.index')
            ->with('success', 'Anggota berhasil ditambahkan.');
    }

    public function edit(Member $member): Response
    {
        return Inertia::render('master/member/edit', [
            'member' => $member,
        ]);
    }

    public function update(Request $request, Member $member): RedirectResponse
    {
        $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'notes'        => ['nullable', 'string'],
        ]);

        $member->update([
            'name'         => $request->name,
            'phone_number' => $request->phone_number,
            'notes'        => $request->notes,
            'updated_by'   => auth()->id(),
        ]);

        return redirect()->route('members.index')
            ->with('success', 'Anggota berhasil diperbarui.');
    }

    public function destroy(Member $member): RedirectResponse
    {
        if ($member->loans()->exists()) {
            return back()->with('error', 'Anggota tidak dapat dihapus karena memiliki data pinjaman.');
        }

        $member->delete();

        return redirect()->route('members.index')
            ->with('success', 'Anggota berhasil dihapus.');
    }
}
