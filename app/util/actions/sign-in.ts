'use server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
    // TODO Sign in logic here
    redirect(`/lobby`);
}