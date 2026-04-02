<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:token {email} {name=OpenAPI}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a Personal Access Token (API Key) for a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $name  = $this->argument('name');

        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        $token = $user->createToken($name);

        $this->info("Token generated successfully for {$user->name} ({$email})");
        $this->line("");
        $this->warn("API KEY (Bearer Token):");
        $this->line($token->plainTextToken);
        $this->line("");
        $this->comment("IMPORTANT: Copy this token now. It will not be shown again.");
        
        return 0;
    }
}
