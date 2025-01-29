import { Chip } from "@mui/material";
import { StacksNetworkName } from "@stacks/network";

const NetworkChip = ({ network }: { network: StacksNetworkName }) => {
    return <Chip label={network} color={network === 'mainnet' ? 'success' : 'warning'} size="small" variant="outlined" />;
};

export default NetworkChip; 