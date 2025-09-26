import Form from 'next/form';
import { signIn } from 'Actions/sign-in';

export default function Home() {

  return (
    <div className="container">
      <Form action={signIn}>
        <input className='form-control' name="name" placeholder='User ID' />
        <button className='form-control' type="submit">Join Lobby</button>
      </Form>
    </div>
  );
}
