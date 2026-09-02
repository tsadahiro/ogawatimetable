import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

import {
  AppBar,
  Box,
  Toolbar,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";

import PresentationEdit from "./components/PresentationEdit";

type Presentation = {
  id: number;
  owner: string;
  title: string;
  abstract: string;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<Presentation[]>([]);
  const [page, setPage] = useState(0);

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function load() {
    const { data, error } = await supabase
      .from("presentation")
      .select("*")
      .order("id");

    if (error) {
      console.error("load error:", error);
      return;
    }

    console.log("loaded presentations:", data);

    setItems((data ?? []) as Presentation[]);
  }

  useEffect(() => {
    load();

    // 現在のログイン状態
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // ログイン状態の変化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // presentation テーブルの Realtime
    const channel = supabase
      .channel("presentation-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "presentation",
        },
        (payload) => {
          console.log("REALTIME EVENT:", payload);

          if (payload.eventType === "INSERT") {
            const newItem = payload.new as Presentation;

            setItems((prev) => {
              // 二重登録防止
              const exists = prev.some(
                (item) => String(item.id) === String(newItem.id)
              );

              if (exists) {
                return prev;
              }

              return [...prev, newItem].sort((a, b) => a.id - b.id);
            });
          }

          if (payload.eventType === "UPDATE") {
            const newItem = payload.new as Presentation;

            setItems((prev) =>
              prev.map((item) =>
                String(item.id) === String(newItem.id)
                  ? newItem
                  : item
              )
            );
          }

          if (payload.eventType === "DELETE") {
            setItems((prev) =>
              prev.filter(
                (item) =>
                  String(item.id) !== String(payload.old.id)
              )
            );
          }
        }
      )
      .subscribe((status, error) => {
        console.log("Realtime status:", status);

        if (error) {
          console.error("Realtime error:", error);
        }
      });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  if (!session) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          variant="contained"
          onClick={signInWithGoogle}
        >
          Googleでログイン
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ mr: 4 }}
          >
            Presentation
          </Typography>

          <Tabs
            value={page}
            onChange={(_, newValue) =>
              setPage(newValue)
            }
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="一覧" />
            <Tab label="編集" />
          </Tabs>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            color="inherit"
            onClick={signOut}
          >
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2 }}>
        <Typography
          variant="body2"
          sx={{ mb: 2 }}
        >
          ようこそ、{session.user.email} さん
        </Typography>

        {page === 0 && (
          <PresentationList items={items} />
        )}

        {page === 1 && (
          <PresentationEdit onSaved={load} />
        )}
      </Box>
    </Box>
  );
}

function PresentationList({
  items,
}: {
  items: Presentation[];
}) {
  return (
    <List>
      {items.map((item) => (
        <ListItem
          key={item.id}
          divider
        >
          <ListItemText
            primary={
              item.title || "(タイトル未入力)"
            }
            secondary={
              <>
                {item.owner}
                <br />
                {item.abstract
                  ? item.abstract.slice(0, 30)
                  : ""}
                {item.abstract &&
                item.abstract.length > 30
                  ? "..."
                  : ""}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
