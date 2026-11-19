import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/siragro_theme.dart';
import 'auth_controller.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Customer Sign In')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Welcome back to SIRAGRO',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 6),
            const Text(
              'Sign in to view your orders, saved addresses, and merge your basket.',
              style: TextStyle(color: SiragroColors.textMuted),
            ),
            const SizedBox(height: 20),
            if (auth.errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: SiragroColors.accentRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  auth.errorMessage!,
                  style: const TextStyle(color: SiragroColors.accentRed),
                ),
              ),
              const SizedBox(height: 14),
            ],
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email address'),
              validator: (v) =>
                  (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _passwordCtrl,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: 'Password',
                suffixIcon: IconButton(
                  tooltip: _obscure ? 'Show password' : 'Hide password',
                  onPressed: () => setState(() => _obscure = !_obscure),
                  icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                ),
              ),
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Enter your password' : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => context.push('/auth/forgot-password'),
                child: const Text('Forgot password?'),
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: auth.isLoading
                  ? null
                  : () async {
                      if (!_formKey.currentState!.validate()) return;
                      final ok = await ref
                          .read(authControllerProvider.notifier)
                          .signIn(
                            email: _emailCtrl.text,
                            password: _passwordCtrl.text,
                          );
                      if (ok && context.mounted) {
                        context.go('/account');
                      }
                    },
              child: Text(auth.isLoading ? 'Signing in…' : 'Sign In'),
            ),
            const SizedBox(height: 14),
            OutlinedButton(
              onPressed: () => context.push('/auth/register'),
              child: const Text('Create a Customer Account'),
            ),
          ],
        ),
      ),
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (auth.errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: SiragroColors.accentRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  auth.errorMessage!,
                  style: const TextStyle(color: SiragroColors.accentRed),
                ),
              ),
              const SizedBox(height: 14),
            ],
            TextFormField(
              controller: _firstCtrl,
              decoration: const InputDecoration(labelText: 'First name'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _lastCtrl,
              decoration: const InputDecoration(labelText: 'Last name'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email address'),
              validator: (v) =>
                  (v == null || !v.contains('@')) ? 'Valid email required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _passwordCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password (min 8 chars)'),
              validator: (v) => (v == null || v.length < 8)
                  ? 'Password must be at least 8 characters'
                  : null,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: auth.isLoading
                  ? null
                  : () async {
                      if (!_formKey.currentState!.validate()) return;
                      final ok = await ref
                          .read(authControllerProvider.notifier)
                          .register(
                            firstName: _firstCtrl.text,
                            lastName: _lastCtrl.text,
                            email: _emailCtrl.text,
                            password: _passwordCtrl.text,
                          );
                      if (ok && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Account created. Check your email if verification is required.',
                            ),
                          ),
                        );
                        context.go('/account');
                      }
                    },
              child: Text(auth.isLoading ? 'Creating…' : 'Create Account'),
            ),
          ],
        ),
      ),
    );
  }
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Enter your account email and we will send a password recovery link.',
            style: TextStyle(color: SiragroColors.textMuted),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email address'),
          ),
          const SizedBox(height: 16),
          if (_sent)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(14),
                child: Text(
                  'If an account exists for that email, a password reset link has been sent.',
                ),
              ),
            )
          else
            ElevatedButton(
              onPressed: auth.isLoading
                  ? null
                  : () async {
                      final ok = await ref
                          .read(authControllerProvider.notifier)
                          .sendPasswordReset(_emailCtrl.text);
                      if (ok && mounted) {
                        setState(() => _sent = true);
                      }
                    },
              child: Text(auth.isLoading ? 'Sending…' : 'Send Reset Link'),
            ),
        ],
      ),
    );
  }
}
