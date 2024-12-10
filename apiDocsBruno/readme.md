# Bruno API Documentation 📚

Welcome to the Bruno API Documentation! This folder contains essential information about using Bruno, a powerful API client for developers. 🚀

## What is Bruno? 🤔

Bruno is a fast and lightweight open-source API client that makes testing and exploring APIs a breeze. It's designed to be user-friendly and efficient, perfect for developers of all skill levels.

## The .bru File Format 📄

Bruno uses a special file format called `.bru` to store API requests and collections. Here's a brief explanation of the `.bru` format:

- It's a human-readable text format
- Each `.bru` file represents a single API request
- The format includes sections for metadata, headers, query parameters, and request body
- It supports variables and environments for flexible testing

Example of a simple `.bru` file:


meta {
  name: Get User
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users/{{userId}}
  headers: {
    Authorization: Bearer {{token}}
  }
}

## Getting Started 🏁

To begin using Bruno, you'll need to download and install it on your system. Here are the download links for various platforms:

- 🍎 macOS: [Download for macOS](https://github.com/usebruno/bruno/releases/latest/download/bruno_mac-x64.dmg)
- 🪟 Windows: [Download for Windows](https://github.com/usebruno/bruno/releases/latest/download/bruno_windows-x64.exe)
- 🐧 Linux: [Download for Linux](https://github.com/usebruno/bruno/releases/latest/download/bruno_linux-x64.AppImage) or `snap install bruno`

***After installation click on open collection and then click on the parent api_docs folder of this file.***

## Exploring the Docs 🔍

In this folder, you'll find detailed documentation on:

- How to create and manage collections
- Writing and executing API requests
- Using variables and environments
- Scripting and automation features
- Best practices for API testing

Happy API testing with Bruno! 🎉
