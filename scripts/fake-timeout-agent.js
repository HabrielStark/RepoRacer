#!/usr/bin/env node
setTimeout(
  () => {
    console.log("fake-timeout-agent finished unexpectedly.");
  },
  24 * 60 * 60 * 1000
);
