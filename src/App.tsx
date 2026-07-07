import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session } from '@supabase/supabase-js'

//type Click = {
//  id: number;
//  created_at: string ;
//};

//async function remove(id:number){
//  console.log(id);
//  const { error } = await supabase
//    .from("click").delete().eq("id", id);
//  if(error){
//    console.log(error);
//  }
//  return;
//}

export default function App() {
  //const [items, setItems] = useState<Click[]>([]);
  const [session, setSession] = useState<Session | null>(null)

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
	redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error(error)
  }
  
  useEffect(() => {
    //async function load() {
    //  const { data, error } = await supabase
    //    .from("click")
    //    .select("*")
    //    .order("id");
    //
    //  if (!error) setItems(data ?? []);
    //}
    //
    //load();

    //const channel = supabase
    //  .channel("click-changes")
    //  .on(
    //    "postgres_changes",
    //    {
    //      event: "*",
    //      schema: "public",
    //      table: "click",
    //    },
    //    (payload) => {
    //      if (payload.eventType === "INSERT") {
    //        setItems((prev) => [...prev, payload.new as Click]);
    //      }
    //
    //      if (payload.eventType === "UPDATE") {
    //        setItems((prev) =>
    //          prev.map((item) =>
    //            item.id === payload.new.id
    //              ? (payload.new as Click)
    //              : item
    //          )
    //        );
    //      }
    //
    //      if (payload.eventType === "DELETE") {
    //        setItems((prev) =>
    //          prev.filter((item) => item.id !== payload.old.id)
    //        );
    //      }
    //    }
    //  )
    //  .subscribe((status) => {
    //	console.log("Realtime status:", status);
    //  });

    // 初回読み込み時に現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // セッションの変化を監視(ログイン/ログアウト時)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, []);


  if (!session) {
    return <button onClick={signInWithGoogle}>Googleでログイン</button>
  }

  return <div>ようこそ、{session.user.email} さん</div>

  //return (
  //  <div>
  //    <h1>Click</h1>
  //
  //    {items.map((item) => (
  //      <div key={item.id}>
  //	  <button onClick={()=>remove(item.id)} > delete </button>
  //	  {item.id}{item.created_at}
  //	</div>
  //    ))}
  //
  //  <button
  //    onClick={async () => {
  //	const { error } = await supabase
  //	  .from("click")
  //	  .insert({});
  //	if (error) console.error(error);
  //    }}
  //  >
  //    Insert click
  //  </button>
  //  </div>
  //);
}
