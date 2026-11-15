        }).filter(Boolean);
        if (!subs.length) return; any = true;
        ph += '<details class="others" data-ig="prodg:' + g.id + '"' + (S.ingOpen['prodg:' + g.id] ? ' open' : '') + '><summary>' + g.i + ' ' + esc(g.n) + '</summary>' +
          subs.map(function (sb) { return '<p class="hint" style="margin:10px 0 0"><b>' + sb.c.i + ' ' + esc(sb.c.n) + '</b></p>' + sb.ps.map(optP).join(''); }).join('') + '</details>';
      });
      if (any) h += '<h3>Uit Mijn producten en prijzen</h3><p class="hint" style="margin-top:0">Dezelfde zes groepen als bij Producten. Producten zonder calorieën staan wel in het recept, maar tellen niet mee in het totaal.</p>' + ph;
  
