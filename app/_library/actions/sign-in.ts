'use server'
import { redirect } from 'next/navigation'
import { signInOrUp } from 'Data/data';

export async function signIn(formData: FormData) {
    const name = formData.get('name') as string;
    await signInOrUp(name);
    redirect(`/lobby?name=${name}`);
}