import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/providers/app_providers.dart';
import '../basket/basket_controller.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.errorMessage,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool clearUser = false,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    final supabase = ref.watch(supabaseClientProvider);
    if (supabase == null) {
      return const AuthState();
    }

    final sub = supabase.auth.onAuthStateChange.listen((data) {
      state = state.copyWith(
        user: data.session?.user,
        clearUser: data.session?.user == null,
      );
    });
    ref.onDispose(sub.cancel);

    return AuthState(user: supabase.auth.currentUser);
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    final supabase = ref.read(supabaseClientProvider);
    if (supabase == null) {
      state = state.copyWith(
        errorMessage:
            'Supabase is not configured. Connect a staging environment first.',
      );
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await supabase.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      state = state.copyWith(user: res.user, isLoading: false);

      // Merge any verified guest basket into the authenticated user's basket on the server
      await ref.read(basketControllerProvider.notifier).mergeGuestBasketOnSignIn();
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
      return false;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Unable to sign in right now. Please try again.',
      );
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    final supabase = ref.read(supabaseClientProvider);
    final config = ref.read(appConfigProvider);
    if (supabase == null) {
      state = state.copyWith(
        errorMessage:
            'Supabase is not configured. Connect a staging environment first.',
      );
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final res = await supabase.auth.signUp(
        email: email.trim(),
        password: password,
        emailRedirectTo: config.emailVerifyRedirectUri.toString(),
        data: {
          'first_name': firstName.trim(),
          'last_name': lastName.trim(),
        },
      );
      state = state.copyWith(user: res.user, isLoading: false);
      if (res.session != null) {
        await ref.read(basketControllerProvider.notifier).mergeGuestBasketOnSignIn();
      }
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
      return false;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Unable to create account right now. Please try again.',
      );
      return false;
    }
  }

  Future<bool> sendPasswordReset(String email) async {
    final supabase = ref.read(supabaseClientProvider);
    final config = ref.read(appConfigProvider);
    if (supabase == null) {
      state = state.copyWith(
        errorMessage:
            'Supabase is not configured. Connect a staging environment first.',
      );
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        redirectTo: config.passwordResetRedirectUri.toString(),
      );
      state = state.copyWith(isLoading: false);
      return true;
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.message);
      return false;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Unable to send reset email right now.',
      );
      return false;
    }
  }

  Future<void> signOut() async {
    final supabase = ref.read(supabaseClientProvider);
    await supabase?.auth.signOut();
    state = const AuthState();
    await ref.read(basketControllerProvider.notifier).refresh();
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);
