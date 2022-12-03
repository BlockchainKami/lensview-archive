<script>

  import "../app.postcss";
  import github from '$lib/images/github.svg';
  import Header from "./Header.svelte";
  // import { createClient, setContextClient } from '@urql/svelte';
  //
  // const client = createClient({
  //     url: 'https://api.lens.dev',
  // });
  //
  // setContextClient(client);
</script>

<div class="bg-gradient-to-r from-slate-900 to-slate-700 text-slate-400">

    <Header/>

    <main>
        <slot />
    </main>

    <footer class="flex flex-row justify-center items-center">
        <div class="text-slate-400 hover:text-orange-500 font-bold"> visit &nbsp;</div>
        <div>
            <a href="https://github.com/sveltejs/kit">
                <img class="w-10 h-10 rounded-full" src={github} alt="GitHub">
            </a>
        </div>
        <div class="text-slate-400 hover:text-orange-500 font-bold">
            &nbsp;to see our code.
        </div>
    </footer>
</div>

<style>

</style>


