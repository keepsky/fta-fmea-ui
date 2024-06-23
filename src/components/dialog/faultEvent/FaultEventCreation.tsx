import * as React from "react";

import { FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import useStyles from "@components/dialog/faultEvent/FaultEventCreation.styles";
import { Controller } from "react-hook-form";
import { EventType, FaultEvent, GateType, gateTypeValues } from "@models/eventModel";
import { useReusableFaultEvents } from "@hooks/useReusableFaultEvents";
import ControlledAutocomplete from "@components/materialui/ControlledAutocomplete";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asArray, updateEventsType } from "@utils/utils";

interface Props {
  useFormMethods: any;
  isRootEvent: boolean;
  eventValue?: FaultEvent;
  isEditedEvent?: boolean;
  disabled?: boolean;
  isSimplified?: boolean;
}

// TODO: remove ts-ignores and migrate to higher version of react-hook-form
const FaultEventCreation = ({
  useFormMethods,
  isRootEvent,
  eventValue,
  isEditedEvent = false,
  disabled,
  isSimplified, // Hides props that are needed only for creation
}: Props) => {
  const { classes } = useStyles();
  const { t } = useTranslation();

  const {
    formState: { errors },
    control,
    setValue,
    reset,
    watch,
    register,
  } = useFormMethods;

  const faultEvents = useReusableFaultEvents();
  const [newEvent, setNewEvent] = useState<String | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FaultEvent | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const existingEventSelected = Boolean(selectedEvent);
  const lastGateTypeRef = useRef(selectedEvent?.gateType);
  const eventTypeWatch = watch("eventType");
  const gateTypeWatch = watch("gateType");

  useEffect(() => {
    if (selectedEvent) {
      setValue("name", selectedEvent.name);
      setValue("existingEvent", selectedEvent.iri ? selectedEvent : null);
    } else {
      reset();
    }
  }, [selectedEvent]);

  const [filteredOptions, setFilteredOptions] = useState([{}]);
  const updatedFHAEventTypes = updateEventsType(faultEvents, "fha-fault-event", EventType.EXTERNAL);

  const handleFilterOptions = (inputValue) => {
    const filtered = faultEvents.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()));
    setNewEvent(inputValue);
    setFilteredOptions(filtered);
  };

  const handleOnCreateEventClick = (e: MouseEvent) => {
    setSelectedEvent({ name: newEvent });
    setShowCreateEvent(true);
  };

  function renderEventSelect() {
    const eventVal = asArray(eventValue?.supertypes)?.[0] || eventValue;
    const defaultValue = eventVal ? { name: eventVal.name, iri: eventVal.iri } : null;
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          {`${t("newFtaModal.eventPlaceholder")}:`}
        </Typography>

        <ControlledAutocomplete
          control={control}
          name="event"
          options={isRootEvent ? faultEvents : updatedFHAEventTypes}
          onChangeCallback={(data: any) => setSelectedEvent(data)}
          onInputChangeCallback={handleFilterOptions}
          onCreateEventClick={handleOnCreateEventClick}
          getOptionKey={(option) => option.iri}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField {...params} label={t("newFtaModal.eventPlaceholder")} variant="outlined" {...register("name")} />
          )}
          defaultValue={defaultValue}
          disabled={disabled}
        />

        {!selectedEvent && !isRootEvent && eventTypeWatch !== EventType.EXTERNAL && (
          <FormControl disabled={existingEventSelected} className={classes.formControl}>
            <InputLabel id="event-type-select-label">{t("newFtaModal.type")}</InputLabel>
            <Controller
              render={({ field }) => {
                const _onChange = field.onChange;
                field.onChange = (e) => {
                  if (e.target.value !== EventType.INTERMEDIATE && e.target.value !== EventType.CONDITIONING) {
                    lastGateTypeRef.current = gateTypeWatch;
                    setValue("gateType", null);
                  } else setValue("gateType", lastGateTypeRef.current ? lastGateTypeRef.current : GateType.OR);
                  _onChange(e);
                };
                return (
                  <Select
                    {...field}
                    disabled={existingEventSelected || disabled}
                    labelId="event-type-select-label"
                    label={t("newFtaModal.type")}
                  >
                    {Object.values(EventType).map((value, index) => (
                      <MenuItem key={index} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                );
              }}
              name="eventType"
              control={control}
              defaultValue={EventType.INTERMEDIATE}
            />
          </FormControl>
        )}
      </>
    );
  }

  function renderEventForm() {
    return (
      <>
        {eventTypeWatch === EventType.INTERMEDIATE && (
          <div className={classes.formControlDiv}>
            <FormControl className={classes.formControl}>
              <InputLabel id="gate-type-select-label">{t("newFtaModal.gateType")}</InputLabel>
              <Controller
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="gate-type-select-label"
                    label={t("newFtaModal.gateType")}
                    error={!!errors.gateType}
                    disabled={disabled}
                  >
                    {gateTypeValues()
                      .filter((value) => value[0])
                      .map((value) => {
                        const [enabled, optionValue] = value;
                        return (
                          <MenuItem key={optionValue} value={optionValue} disabled={!enabled}>
                            {optionValue}
                          </MenuItem>
                        );
                      })}
                  </Select>
                )}
                name="gateType"
                control={control}
                defaultValue={GateType.OR}
              />
            </FormControl>
          </div>
        )}

        {eventTypeWatch !== EventType.INTERMEDIATE &&
          eventTypeWatch !== EventType.EXTERNAL &&
          !isRootEvent &&
          isEditedEvent && (
            <>
              {/*TODO: sort out default value UI bug*/}
              <TextField
                margin="dense"
                label={t("newFtaModal.description")}
                fullWidth
                error={!!errors.description}
                helperText={errors.description?.message}
                defaultValue=""
                disabled={existingEventSelected}
                {...register("description")}
              />

              {/* Probability field */}
              {!isSimplified && eventTypeWatch === EventType.BASIC && (
                <TextField
                  label={t("newFtaModal.probability")}
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  error={!!errors.probability}
                  helperText={errors.probability?.message}
                  className={classes.probability}
                  defaultValue=""
                  {...register("probability")}
                />
              )}

              {(gateTypeWatch === GateType.PRIORITY_AND || !gateTypeWatch) &&
                eventTypeWatch === EventType.INTERMEDIATE &&
                gateTypeWatch === GateType.PRIORITY_AND && (
                  <TextField
                    label="Sequence Probability"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    error={!!errors.sequenceProbability}
                    helperText={errors.sequenceProbability?.message}
                    className={classes.sequenceProbability}
                    defaultValue=""
                    {...register("sequenceProbability")}
                  />
                )}
            </>
          )}
      </>
    );
  }

  return (
    <div className={classes.divForm}>
      {renderEventSelect()}
      {renderEventForm()}
    </div>
  );
};

export default FaultEventCreation;
