import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeChatStorageOrigin,
  sanitizeChatMediaUrl,
} from "./chat-media-url.js";

const options = { storageOrigin: "https://s3.twcstorage.ru" };

test("chat media URL sanitizer rejects executable and untrusted URLs", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "http://s3.twcstorage.ru/file.jpg",
    "https://attacker.example/phishing",
    "https://evilgoogleusercontent.com/avatar.jpg",
    "//attacker.example/file.jpg",
    "/api/redirect?to=https://attacker.example",
  ]) {
    assert.equal(sanitizeChatMediaUrl(value, options), "");
  }
});

test("chat media URL sanitizer accepts configured storage and trusted identity avatars", () => {
  assert.equal(
    sanitizeChatMediaUrl(
      "https://s3.twcstorage.ru/bucket/chat/image.jpg?signature=value",
      options,
    ),
    "https://s3.twcstorage.ru/bucket/chat/image.jpg?signature=value",
  );
  assert.equal(
    sanitizeChatMediaUrl("https://lh3.googleusercontent.com/a/avatar", options),
    "https://lh3.googleusercontent.com/a/avatar",
  );
  assert.equal(
    sanitizeChatMediaUrl("https://sun9-1.userapi.com/avatar.jpg", options),
    "https://sun9-1.userapi.com/avatar.jpg",
  );
});

test("chat storage origin normalization only exposes an HTTPS origin", () => {
  assert.equal(
    normalizeChatStorageOrigin("https://s3.twcstorage.ru/private/bucket"),
    "https://s3.twcstorage.ru",
  );
  assert.equal(normalizeChatStorageOrigin("javascript:alert(1)"), "");
  assert.equal(normalizeChatStorageOrigin("http://s3.twcstorage.ru"), "");
});
