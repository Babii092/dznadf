import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    Pressable,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordSchema } from "@/schemas/ResetPasswordSchema";
import { IResetPasswordType } from "@/types/auth/IResetPasswordType";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/api/apiSlice";
import { getApiError } from "@/api/apiErrors";

const ResetPasswordScreen = () => {
    // Дістаємо email, переданий із попереднього екрану через параметри маршруту
    const params = useLocalSearchParams<{ email?: string }>();
    const [serverError, setServerError] = useState<string | null>(null);

    // Мутації RTK Query для зміни пароля та повторної відправки коду
    const [resetPassword] = useResetPasswordMutation();
    const [forgotPassword] = useForgotPasswordMutation();

    // Ініціалізуємо форму з валідацією Zod і підставляємо переданий email
    const {
        control,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<IResetPasswordType>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: { email: params.email ?? "", code: "", newPassword: "" },
    });

    // Відправляємо email, код і новий пароль на сервер, після успіху перекидаємо на вхід
    const onSubmit = async (data: IResetPasswordType) => {
        setServerError(null);
        try {
            await resetPassword(data).unwrap();
            Alert.alert("Готово", "Пароль змінено. Увійдіть з новим паролем.", [
                { text: "OK", onPress: () => router.replace("/login") },
            ]);
        } catch (error) {
            setServerError(getApiError(error).message ?? "Не вдалося змінити пароль. Спробуйте ще раз.");
        }
    };

    // Запит нового коду на поточну пошту з форми, якщо старий не дійшов або прострочився
    const onResendCode = async () => {
        setServerError(null);
        try {
            await forgotPassword({ email: getValues("email") }).unwrap();
            Alert.alert("Готово", "Новий код надіслано на пошту.");
        } catch {
            setServerError("Не вдалося надіслати код повторно. Спробуйте пізніше.");
        }
    };

    return (
        <SafeAreaView className="flex-1">
            {/* Піднімаємо форму при появі клавіатури */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="flex-grow px-6 py-10"
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    automaticallyAdjustKeyboardInsets
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                            <Text className="mb-2 text-center text-3xl font-bold text-slate-900">
                                Новий пароль
                            </Text>
                            <Text className="mb-8 text-center text-base text-slate-500">
                                Введіть 6-значний код із листа і придумайте новий пароль
                            </Text>

                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-medium text-slate-700">
                                    Електронна пошта
                                </Text>

                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            className="mb-2 h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 focus:border-indigo-500 focus:bg-white"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholderTextColor="#94a3b8"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                        />
                                    )}
                                />

                                {errors.email && (
                                    <Text className="mt-1 text-xs text-red-500">{errors.email.message}</Text>
                                )}
                            </View>

                            {/* Поле для 6-значного коду: цифрова клавіатура та ліміт 6 символів */}
                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-medium text-slate-700">
                                    Код із листа
                                </Text>

                                <Controller
                                    control={control}
                                    name="code"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            className="mb-2 h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-center text-2xl font-semibold tracking-widest text-slate-900 focus:border-indigo-500 focus:bg-white"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholder="••••••"
                                            placeholderTextColor="#94a3b8"
                                            keyboardType="number-pad"
                                            maxLength={6}
                                        />
                                    )}
                                />

                                {errors.code && (
                                    <Text className="mt-1 text-xs text-red-500">{errors.code.message}</Text>
                                )}
                            </View>

                            {/* Поле для нового пароля */}
                            <View className="mb-5">
                                <Text className="mb-2 text-sm font-medium text-slate-700">
                                    Новий пароль
                                </Text>

                                <Controller
                                    control={control}
                                    name="newPassword"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            className="mb-2 h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base text-slate-900 focus:border-indigo-500 focus:bg-white"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            placeholder="••••••••"
                                            placeholderTextColor="#94a3b8"
                                            secureTextEntry
                                            autoCapitalize="none"
                                        />
                                    )}
                                />

                                {errors.newPassword && (
                                    <Text className="mt-1 text-xs text-red-500">{errors.newPassword.message}</Text>
                                )}
                            </View>

                            {serverError && (
                                <Text className="mb-4 text-sm text-red-500">{serverError}</Text>
                            )}
