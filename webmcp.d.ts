/**
 * WebMCP declarative attributes (https://developer.chrome.com/docs/ai/webmcp):
 * a <form> describes itself as a tool an AI agent can call, and each field as
 * one of its parameters. Plain HTML attributes — React passes them through.
 */
import "react";

declare module "react" {
  interface FormHTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
  }
  interface InputHTMLAttributes<T> {
    toolparamtitle?: string;
    toolparamdescription?: string;
  }
  interface TextareaHTMLAttributes<T> {
    toolparamtitle?: string;
    toolparamdescription?: string;
  }
}
