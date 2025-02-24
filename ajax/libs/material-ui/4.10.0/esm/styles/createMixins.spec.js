import _extends from "@babel/runtime/helpers/esm/extends";
import { createMuiTheme, makeStyles } from '@material-ui/core/styles';
{
  var theme = createMuiTheme({
    mixins: {
      toolbar: {
        background: '#fff',
        minHeight: 36,
        '@media (min-width:0px) and (orientation: landscape)': {
          minHeight: 24
        },
        '@media (min-width:600px)': {
          minHeight: 48
        }
      }
    }
  });
  var useStyles = makeStyles(function (theme) {
    return {
      appBarSpacer: theme.mixins.toolbar,
      toolbarIcon: _extends({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px'
      }, theme.mixins.toolbar)
    };
  });
}