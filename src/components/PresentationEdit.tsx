import { useEffect, useState } from "react";
import { supabase } from "../supabase";

import {
  Box,
  Button,
  TextField,
} from "@mui/material";

type Props = {
  onSaved?: () => void | Promise<void>;
};

export default function PresentationEdit({
  onSaved,
}: Props) {
  const [owner, setOwner] = useState("");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  //const [gids, setGids] = useState<string[]>([""]);
  
  useEffect(() => {
    async function loadMyPresentation() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const email = session?.user.email;

      if (!email) {
        return;
      }

      // 例:
      // abcdef@example.com
      // → abcdef
      const myOwner = email.slice(0, 6);

      setOwner(myOwner);

      const { data, error } = await supabase
        .from("presentation")
        .select("*")
        .eq("owner", myOwner)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setTitle(data.title ?? "");
        setAbstract(data.abstract ?? "");
      }
    }

    loadMyPresentation();
  }, []);

  async function save() {
    const { data: existing, error: selectError } =
      await supabase
        .from("presentation")
        .select("id")
        .eq("owner", owner)
        .maybeSingle();

    if (selectError) {
      console.error(selectError);
      return;
    }

    if (existing) {
      const { error } = await supabase
        .from("presentation")
        .update({
          title,
          abstract,
        })
        .eq("owner", owner);

      if (error) {
        console.error("update error:", error);
        return;
      }
    } else {
      const { error } = await supabase
        .from("presentation")
        .insert({
          owner,
          title,
          abstract,
        });

      if (error) {
        console.error("insert error:", error);
        return;
      }
    }

    // 保存後、App 側で presentation 全件を読み直す
    await onSaved?.();
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 800,
      }}
    >
      <TextField
        label="owner"
        value={owner}
        disabled
      />

      <TextField
        label="タイトル"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
      />

      <TextField
        label="概要"
        value={abstract}
        onChange={(e) =>
          setAbstract(e.target.value)
        }
        multiline
        minRows={8}
      />

      <Button
        variant="contained"
        onClick={save}
      >
        保存
      </Button>
    </Box>
  );
}
//import { useEffect, useState } from "react";
//import {
//  Box,
//  Button,
//  CircularProgress,
//  TextField,
//  Typography,
//} from "@mui/material";
//
//import { supabase } from "../supabase";
//// ↑ PresentationEdit.tsx の置き場所に応じて変更してください
//
//export default function PresentationEdit() {
//  const [owner, setOwner] = useState("");
//  const [title, setTitle] = useState("");
//  const [abstract, setAbstract] = useState("");
//
//  const [loading, setLoading] = useState(true);
//  const [saving, setSaving] = useState(false);
//
//  useEffect(() => {
//    const load = async () => {
//      setLoading(true);
//
//      // 現在ログインしているユーザーを取得
//      const {
//        data: { session },
//        error: sessionError,
//      } = await supabase.auth.getSession();
//
//      if (sessionError) {
//        console.error(sessionError);
//        setLoading(false);
//        return;
//      }
//
//      const email = session?.user?.email;
//
//      if (!email) {
//        console.error("メールアドレスを取得できませんでした");
//        setLoading(false);
//        return;
//      }
//
//      // Googleメールアドレスの先頭6文字
//      const myOwner = email.slice(0, 6);
//      setOwner(myOwner);
//
//      // owner が一致するレコードを取得
//      const { data, error } = await supabase
//        .from("presentation")
//        .select("title, abstract")
//        .eq("owner", myOwner)
//        .maybeSingle();
//
//      if (error) {
//        console.error(error);
//        setLoading(false);
//        return;
//      }
//
//      // レコードがあれば初期値として設定
//      // なければ空文字
//      setTitle(data?.title ?? "");
//      setAbstract(data?.abstract ?? "");
//
//      setLoading(false);
//    };
//
//    load();
//  }, []);
//
//  const save = async () => {
//    if (!owner) {
//      alert("owner が取得できません");
//      return;
//    }
//
//    setSaving(true);
//
//    const { error } = await supabase
//      .from("presentation")
//      .upsert(
//        {
//          owner: owner,
//          title: title,
//          abstract: abstract,
//        },
//        {
//          onConflict: "owner",
//        }
//      );
//
//    if (error) {
//      console.error(error);
//      alert("保存に失敗しました");
//    } else {
//      alert("保存しました");
//    }
//
//    setSaving(false);
//  };
//
//  if (loading) {
//    return (
//      <Box
//        sx={{
//          display: "flex",
//          justifyContent: "center",
//          mt: 5,
//        }}
//      >
//        <CircularProgress />
//      </Box>
//    );
//  }
//
//  return (
//    <Box
//      sx={{
//        maxWidth: 800,
//        mx: "auto",
//        mt: 4,
//        px: 2,
//      }}
//    >
//      <Typography variant="h5" sx={{ mb: 3 }}>
//        発表内容の編集
//      </Typography>
//
//      <Typography
//        variant="body2"
//        color="text.secondary"
//        sx={{ mb: 2 }}
//      >
//        owner: {owner}
//      </Typography>
//
//      <TextField
//        label="Title"
//        value={title}
//        onChange={(e) => setTitle(e.target.value)}
//        fullWidth
//        sx={{ mb: 3 }}
//      />
//
//      <TextField
//        label="Abstract"
//        value={abstract}
//        onChange={(e) => setAbstract(e.target.value)}
//        fullWidth
//        multiline
//        minRows={12}
//        sx={{ mb: 3 }}
//      />
//
//      <Button
//        variant="contained"
//        onClick={save}
//        disabled={saving}
//      >
//        {saving ? "保存中..." : "保存"}
//      </Button>
//    </Box>
//  );
//}
