# Name Picker Party — legacy Vol 5 URL

The 30-game app now lives in `pctppsptutor-lab/goi-ten-vui-nhon`, at https://pctppsptutor-lab.github.io/goi-ten-vui-nhon/GoiTenVuiNhon/.

This public URL redirects to the corresponding game in the unified app and preserves game, class and hash parameters. `sw.js` redirects navigations only inside this old site’s scope; an open editor or round is left intact until the next navigation. It it does not change class lists or selection history in localStorage.

Run `npm run check:build` to validate the redirect. The previous game source and assets remain here during transition for rollback. Do not publish changes to that old app; development belongs in the main repository. An unvisited game needs an online first load at the new URL.
