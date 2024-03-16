import * as React from "react";
import FaultTreePathRow from "@components/dialog/faultTree/paths/FaultTreePathRow";
import { Typography } from "@mui/material";
import { FaultEvent } from "@models/eventModel";
import { RiskPriorityNumber } from "@models/rpnModel";
import { useFaultTreePathsAggregate } from "@hooks/useFaultTreePathsAggregate";
import { useTranslation } from "react-i18next";

interface Props {
  updatePaths: (rowId: number, path: FaultEvent[]) => void;
  updateRpn: (rowId: number, rpn: RiskPriorityNumber) => void;
}

const FaultTreePathsAggregate = ({ updatePaths, updateRpn }: Props) => {
  const paths = useFaultTreePathsAggregate();
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Typography variant="subtitle1">{t("newFmeaModal.effects")}</Typography>
      {paths &&
        paths.map((path, index) => {
          updatePaths(index, path);
          return (
            <FaultTreePathRow
              path={path}
              rowId={index}
              onRowChanged={(rowId, effects) => updatePaths(rowId, effects)}
              onRpnChanged={(rowId, rpn) => updateRpn(rowId, rpn)}
            />
          );
        })}
    </React.Fragment>
  );
};

export default FaultTreePathsAggregate;
